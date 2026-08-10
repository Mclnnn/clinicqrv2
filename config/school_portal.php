<?php

return [
    /*
    |--------------------------------------------------------------------------
    | School Portal Authentication Driver
    |--------------------------------------------------------------------------
    |
    | "dummy" is used during ClinicQR development. When the school IT provides
    | the real API/SSO details, this can be changed to "api" and wired to the
    | official provider without replacing the ClinicQR login flow.
    |
    */

    'driver' => env('SCHOOL_PORTAL_AUTH_DRIVER', 'dummy'),

    /*
    |--------------------------------------------------------------------------
    | Temporary Dummy School Portal Accounts
    |--------------------------------------------------------------------------
    |
    | These accounts simulate successful school portal authentication while the
    | official integration is not yet available.
    |
    */

    'dummy_accounts' => [
        [
            'portal_id' => 'DSSC-STUDENT-0001',
            'login' => 'student.portal@dssc.edu.ph',
            'password' => 'portal123',
            'name' => 'Demo Portal Student',
            'email' => 'student.portal@dssc.edu.ph',
            'user_type' => 'Student',
            'student_id' => '2026-PORTAL-001',
            'employee_id' => null,
            'department' => 'BSIT',
        ],
        [
            'portal_id' => 'DSSC-FACULTY-0001',
            'login' => 'faculty.portal@dssc.edu.ph',
            'password' => 'portal123',
            'name' => 'Demo Portal Faculty',
            'email' => 'faculty.portal@dssc.edu.ph',
            'user_type' => 'Employee',
            'student_id' => null,
            'employee_id' => 'FAC-PORTAL-001',
            'department' => 'Faculty',
        ],
    ],
];
