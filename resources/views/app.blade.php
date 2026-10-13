<!DOCTYPE html>
<html lang="es">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>APOTHIKA | Tu farmacia, más cerca</title>
        @vite(['resources/css/app.css', 'resources/js/customer.js'])
    </head>
    <body class="min-h-screen bg-slate-100">
        <div id="app"></div>
    </body>
</html>
