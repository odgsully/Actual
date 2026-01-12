export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { default: tracer } = await import('dd-trace');

    tracer.init({
      service: process.env.DD_SERVICE || 'wabbit',
      env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
      version: process.env.DD_VERSION || '1.0.0',
      logInjection: true,
      // Disable features that require native binaries (not available on macOS arm64/x64)
      runtimeMetrics: false,
      profiling: false,
      appsec: false,
    });
  }
}
