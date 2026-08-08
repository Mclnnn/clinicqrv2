<?php

namespace App\Support;

class QrUrl
{
    public static function baseUrl(): string
    {
        $configuredBase = config('app.qr_base_url', config('app.url'));
        $requestBase = request()?->getSchemeAndHttpHost();

        if ($requestBase && self::isLocalUrl($configuredBase) && ! self::isLocalUrl($requestBase)) {
            return rtrim($requestBase, '/');
        }

        return rtrim($configuredBase ?: $requestBase ?: config('app.url'), '/');
    }

    private static function isLocalUrl(?string $url): bool
    {
        if (! $url) {
            return false;
        }

        $host = parse_url($url, PHP_URL_HOST) ?: $url;

        return $host === 'localhost'
            || $host === '127.0.0.1'
            || str_ends_with($host, '.test');
    }
}
