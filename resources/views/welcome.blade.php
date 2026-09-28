<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'ClinicSoft') }}</title>
    <link rel="icon" type="image/png" href="/images/logo.png">
    <link rel="apple-touch-icon" href="/images/logo.png">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#14B8A6">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="ClinicSoft">
    <style>html, body { height: 100%; margin: 0; } #root { height: 100%; }</style>
    @viteReactRefresh
    @vite('resources/js/main.tsx')
</head>
<body>
    <div id="root"></div>
</body>
</html>
