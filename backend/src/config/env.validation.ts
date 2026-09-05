export function validateEnvironment(config: Record<string, any>) {
  const isProduction = config.NODE_ENV === 'production';

  const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];

  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!config[varName] || config[varName].trim() === '') {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `[FATAL] Missing required environment configuration: ${missing.join(', ')}.`;
    if (isProduction) {
      throw new Error(errorMsg);
    } else {
      console.warn(`[WARN] Development warning: ${errorMsg}`);
    }
  }

  if (isProduction && config.JWT_SECRET === 'default_secret_key_change_in_production') {
    throw new Error('[FATAL] Insecure default JWT_SECRET detected in production environment!');
  }

  return config;
}
