<?php

namespace App\Services\SchoolPortal;

interface SchoolPortalAuthProvider
{
    /**
     * Authenticate a user against the selected school portal provider.
     *
     * Returns a normalized portal profile when successful, or null when the
     * credentials are not accepted.
     */
    public function authenticate(string $login, string $password): ?array;
}
