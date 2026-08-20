<?php

namespace App\Providers;

use App\Socialite\StudentPortalProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Laravel\Socialite\Facades\Socialite;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (str_starts_with((string) config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }

        $this->configureSocialite();
    }

    /**
     * Register custom Socialite providers.
     */
    protected function configureSocialite(): void
    {
        if (class_exists(Socialite::class)) {
            Socialite::extend('student_portal', function ($app) {
                $config = $app['config']['services.student_portal'] ?? [];

                return Socialite::buildProvider(
                    StudentPortalProvider::class,
                    $config
                );
            });
        }
    }
}
