<?php

namespace App\Socialite;

use GuzzleHttp\Client;
use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\ProviderInterface;
use Laravel\Socialite\Two\User;

class StudentPortalProvider extends AbstractProvider implements ProviderInterface
{
    /**
     * Get the base URL for the Student Portal provider.
     */
    protected function getPortalBaseUrl(): string
    {
        return rtrim((string) config('services.student_portal.url', 'http://portal.dssc.edu.ph:5566'), '/');
    }

    /**
     * Get the authentication URL for the provider.
     *
     * @param  string  $state
     * @return string
     */
    protected function getAuthUrl($state)
    {
        return $this->buildAuthUrlFromBase($this->getPortalBaseUrl() . '/oauth/authorize', $state);
    }

    /**
     * Get the token URL for the provider.
     *
     * @return string
     */
    protected function getTokenUrl()
    {
        return $this->getPortalBaseUrl() . '/oauth/token';
    }

    /**
     * Get the raw user for the given access token.
     *
     * @param  string  $token
     * @return array
     */
    protected function getUserByToken($token)
    {
        $response = $this->getHttpClient()->get($this->getPortalBaseUrl() . '/api/user', [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Accept' => 'application/json',
            ],
        ]);

        return json_decode((string) $response->getBody(), true) ?? [];
    }

    /**
     * Map the raw user array to a Socialite User instance.
     *
     * @param  array  $user
     * @return User
     */
    protected function mapUserToObject(array $user)
    {
        $studentId = $user['Student ID']
            ?? $user['student_id']
            ?? $user['studentId']
            ?? null;

        $name = $user['FullName']
            ?? $user['name']
            ?? $user['full_name']
            ?? null;

        $email = $user['Email']
            ?? $user['email']
            ?? null;

        $program = $user['Program']
            ?? $user['program']
            ?? null;

        $departmentCode = $user['Department Code']
            ?? $user['department_code']
            ?? $user['departmentCode']
            ?? null;

        $yearLevel = $user['Year Level']
            ?? $user['year_level']
            ?? $user['yearLevel']
            ?? null;

        $college = $user['College']
            ?? $user['college']
            ?? null;

        $collegeCode = $user['College Code']
            ?? $user['college_code']
            ?? $user['collegeCode']
            ?? null;

        $department = $program
            ?? $departmentCode
            ?? $college
            ?? ($user['department'] ?? null);

        $id = $user['id']
            ?? $studentId
            ?? $email;

        return (new User)->setRaw($user)->map([
            'id' => $id,
            'nickname' => null,
            'name' => $name,
            'email' => $email,
            'student_id' => $studentId,
            'employee_id' => $user['Employee ID'] ?? $user['employee_id'] ?? null,
            'user_type' => $user['user_type'] ?? ($studentId ? 'Student' : 'User'),
            'department' => $department,
            'program' => $program,
            'department_code' => $departmentCode,
            'year_level' => $yearLevel,
            'college' => $college,
            'college_code' => $collegeCode,
            'avatar' => null,
        ]);
    }
}
