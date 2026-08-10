<?php

namespace App\Services\SchoolPortal;

use RuntimeException;

class SchoolPortalAuthService
{
    public function authenticate(string $login, string $password): ?array
    {
        return $this->provider()->authenticate($login, $password);
    }

    private function provider(): SchoolPortalAuthProvider
    {
        return match (config('school_portal.driver', 'dummy')) {
            'dummy' => new DummySchoolPortalAuthProvider(),

            /*
             * Future integration point:
             * 'api' => app(RealSchoolPortalApiAuthProvider::class),
             */

            default => throw new RuntimeException('Unsupported school portal auth driver.'),
        };
    }
}
