export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { default: tracer } = await import('dd-trace');

    tracer.init({
      service: process.env.DD_SERVICE || 'gs-site',
      env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
      version: process.env.DD_VERSION || '1.0.0',
      hostname: process.env.DD_AGENT_HOST || '127.0.0.1',
      port: 8126,
      logInjection: true,
      // Disable features that require native binaries (not available on macOS arm64/x64)
      runtimeMetrics: false,
      profiling: false,
      appsec: false,
    });
  }
}
