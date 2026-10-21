import { ModulesContainer } from '@nestjs/core';
import { METHOD_METADATA, PATH_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { RequestMethod } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ROLES_KEY } from '../auth/roles.decorator';

export interface RouteInfo {
  controller: string;
  method: string;
  path: string;
  authenticated: boolean;
  guards: string[];
  roles: string[];
  /** True when the handler receives the request object (so it can know who is calling). */
  usesRequest: boolean;
  /** Names read from the body, query string or URL path with @Body('x') / @Query('x') / @Param('x'). */
  inputs: string[];
}

const join = (a: string, b: string) => '/' + [a, b].map((p) => (p ?? '').replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/');
const guardsOn = (target: any): any[] => Reflect.getMetadata('__guards__', target) ?? [];

/** Reads the real decorator metadata of every registered controller. Nothing here is hand-written. */
export function collectRoutes(modules: ModulesContainer): RouteInfo[] {
  const routes: RouteInfo[] = [];
  const seen = new Set<any>();
  for (const mod of modules.values()) {
    for (const wrapper of mod.controllers.values()) {
      const ctrl = wrapper.metatype as any;
      if (!ctrl || seen.has(ctrl)) continue;
      seen.add(ctrl);
      const base = Reflect.getMetadata(PATH_METADATA, ctrl) ?? '';
      for (const name of Object.getOwnPropertyNames(ctrl.prototype)) {
        const handler = ctrl.prototype[name];
        if (name === 'constructor' || typeof handler !== 'function') continue;
        const verb = Reflect.getMetadata(METHOD_METADATA, handler);
        if (verb === undefined) continue;
        const sub = Reflect.getMetadata(PATH_METADATA, handler) ?? '';
        const guards = [...guardsOn(ctrl), ...guardsOn(handler)];
        const roles: string[] = Reflect.getMetadata(ROLES_KEY, handler) ?? Reflect.getMetadata(ROLES_KEY, ctrl) ?? [];
        const args: Record<string, { index: number; data?: any }> = Reflect.getMetadata(ROUTE_ARGS_METADATA, ctrl, name) ?? {};
        const kinds = Object.keys(args).map((k) => Number(k.split(':')[0]));
        const inputs = Object.entries(args)
          .filter(([k]) => [RouteParamtypes.BODY, RouteParamtypes.QUERY, RouteParamtypes.PARAM].includes(Number(k.split(':')[0])))
          .map(([, v]) => (typeof v.data === 'string' ? v.data : '(whole)'));
        routes.push({
          usesRequest: kinds.includes(RouteParamtypes.REQUEST),
          inputs,
          controller: ctrl.name,
          method: RequestMethod[verb],
          path: join(base, Array.isArray(sub) ? sub[0] : sub),
          authenticated: guards.includes(JwtAuthGuard),
          guards: guards.map((g) => g?.name ?? String(g)),
          roles,
        });
      }
    }
  }
  return routes.sort((a, b) => (a.path + a.method).localeCompare(b.path + b.method));
}
