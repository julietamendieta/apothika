<!DOCTYPE html>
<html lang="es">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Acceso de farmacia | APOTHIKA</title>
        @vite(['resources/css/app.css'])
    </head>
    <body class="min-h-screen bg-emerald-950 text-slate-900">
        <main class="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5 py-12">
            <section class="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
                <a href="/" class="text-sm font-semibold text-emerald-800">APOTHIKA</a>
                <p class="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Portal de farmacia</p>
                <h1 class="mt-2 text-3xl font-bold">Iniciar sesión</h1>
                <p class="mt-2 text-sm text-slate-600">Acceso exclusivo para el personal autorizado.</p>
                <form method="POST" action="{{ route('admin.login.store') }}" class="mt-8 space-y-5">
                    @csrf
                    <label class="block">
                        <span class="mb-2 block text-sm font-medium">Usuario</span>
                        <input name="username" value="{{ old('username') }}" autocomplete="username" required autofocus class="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100">
                    </label>
                    <label class="block">
                        <span class="mb-2 block text-sm font-medium">Contraseña</span>
                        <input name="password" type="password" autocomplete="current-password" required class="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100">
                    </label>
                    @if ($errors->any())
                        <p role="alert" class="text-sm text-red-700">{{ $errors->first() }}</p>
                    @endif
                    <button type="submit" class="w-full rounded-lg bg-emerald-800 px-4 py-3 font-semibold text-white hover:bg-emerald-900">Entrar</button>
                </form>
                <a href="/" class="mt-6 inline-block text-sm text-slate-600 hover:text-emerald-800">Volver al área de clientes</a>
            </section>
        </main>
    </body>
</html>