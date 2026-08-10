<?php

namespace App\Services\SchoolPortal;

class DummySchoolPortalAuthProvider implements SchoolPortalAuthProvider
{
    public function authenticate(string $login, string $password): ?array
    {
        $login = strtolower(trim($login));

        foreach (config('school_portal.dummy_accounts', []) as $account) {
            $accountLogin = strtolower(trim($account['login'] ?? ''));

            if ($accountLogin === $login && ($account['password'] ?? null) === $password) {
                return [
                    'portal_id' => $account['portal_id'],
                    'name' => $account['name'],
                    'email' => $account['email'],
                    'user_type' => $account['user_type'],
                    'student_id' => $account['student_id'] ?? null,
                    'employee_id' => $account['employee_id'] ?? null,
                    'department' => $account['department'] ?? null,
                    'status' => 'active',
                ];
            }
        }

        return null;
    }
}
