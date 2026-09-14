import { Injectable, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as dns from 'dns';
import * as net from 'net';

@Injectable()
export class SsrfGuardService {
  private readonly logger = new Logger(SsrfGuardService.name);

  // Prohibited hostnames (case-insensitive)
  private readonly blockedHostnames = [
    'localhost',
    'metadata.google.internal',
    'instance-data',
    '169.254.169.254',
  ];

  /**
   * Validates that a target URL does not resolve to loopback, private subnets,
   * cloud instance metadata services, or non-HTTP protocols.
   * Throws ForbiddenException or BadRequestException if prohibited.
   */
  async validateUrl(urlString: string): Promise<boolean> {
    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      throw new BadRequestException(`SSRF protection: Invalid URL '${urlString}'`);
    }

    // Protocol check: Only http: and https: permitted
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException(
        `SSRF protection: Prohibited protocol '${parsed.protocol}'. Only http: and https: allowed.`,
      );
    }

    const hostname = parsed.hostname.toLowerCase().trim();

    // Check blocked hostnames
    if (
      this.blockedHostnames.includes(hostname) ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      this.logger.warn(`SSRF attempt blocked by hostname: ${hostname}`);
      throw new ForbiddenException(`SSRF protection: Prohibited host '${hostname}'`);
    }

    // If hostname is directly an IP address
    if (net.isIP(hostname)) {
      if (this.isProhibitedIp(hostname)) {
        this.logger.warn(`SSRF attempt blocked by direct IP: ${hostname}`);
        throw new ForbiddenException(
          `SSRF protection: Prohibited destination IP address '${hostname}'`,
        );
      }
      return true;
    }

    // DNS Resolution to prevent DNS rebinding attacks
    try {
      const records = await dns.promises.lookup(hostname, { all: true });
      for (const record of records) {
        if (this.isProhibitedIp(record.address)) {
          this.logger.warn(
            `SSRF attempt blocked by resolved IP: ${hostname} -> ${record.address}`,
          );
          throw new ForbiddenException(
            `SSRF protection: Hostname '${hostname}' resolved to prohibited IP '${record.address}'`,
          );
        }
      }
    } catch (err) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException) {
        throw err;
      }
      this.logger.warn(`DNS resolution failed for hostname '${hostname}': ${err.message}`);
      throw new BadRequestException(
        `SSRF protection: Unable to resolve destination host '${hostname}'`,
      );
    }

    return true;
  }

  /**
   * Non-throwing version for conditional execution.
   */
  async isSafeUrl(urlString: string): Promise<boolean> {
    try {
      await this.validateUrl(urlString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Evaluates whether an IP address belongs to loopback, RFC1918 private,
   * link-local, cloud metadata, or reserved networks.
   */
  isProhibitedIp(ip: string): boolean {
    const cleanIp = ip.trim();

    // Handle IPv4-mapped IPv6 addresses (::ffff:127.0.0.1)
    if (cleanIp.startsWith('::ffff:')) {
      const mappedIpv4 = cleanIp.slice(7);
      if (net.isIPv4(mappedIpv4)) {
        return this.isProhibitedIp(mappedIpv4);
      }
    }

    // IPv6 checks
    if (net.isIPv6(cleanIp)) {
      const lower = cleanIp.toLowerCase();
      // Loopback
      if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
      // Unspecified
      if (lower === '::' || lower === '0:0:0:0:0:0:0:0') return true;
      // Unique local (fc00::/7)
      if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
      // Link-local (fe80::/10)
      if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true;
      return false;
    }

    // IPv4 checks
    if (net.isIPv4(cleanIp)) {
      const parts = cleanIp.split('.').map((p) => parseInt(p, 10));
      if (parts.length !== 4 || parts.some(isNaN)) return true;

      const [b0, b1, b2, b3] = parts;

      // Loopback (127.0.0.0/8)
      if (b0 === 127) return true;

      // Zero network (0.0.0.0/8)
      if (b0 === 0) return true;

      // RFC 1918 Private: 10.0.0.0/8
      if (b0 === 10) return true;

      // RFC 1918 Private: 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
      if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;

      // RFC 1918 Private: 192.168.0.0/16
      if (b0 === 192 && b1 === 168) return true;

      // Link-local & Cloud Metadata: 169.254.0.0/16
      if (b0 === 169 && b1 === 254) return true;

      // Carrier-grade NAT: 100.64.0.0/10 (100.64.x.x - 100.127.x.x)
      if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;

      // Broadcast & Reserved (224.0.0.0/4, 240.0.0.0/4, 255.255.255.255)
      if (b0 >= 224) return true;

      return false;
    }

    return true; // If not valid IPv4 or IPv6, prohibit
  }
}
