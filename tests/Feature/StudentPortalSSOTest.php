<?php

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

uses(RefreshDatabase::class);

test('student portal redirect route redirects to authentication page', function () {
    config()->set('services.student_portal', [
        'client_id' => 'test-client-id',
        'client_secret' => 'test-secret',
        'redirect' => 'http://localhost/auth/student-portal/callback',
        'url' => 'http://portal.dssc.edu.ph:5566',
    ]);

    $response = $this->get(route('student-portal.redirect'));

    $response->assertRedirect();
    $this->assertStringContainsString('http://portal.dssc.edu.ph:5566/oauth/authorize', $response->headers->get('Location'));
});

test('student portal callback creates and authenticates new student user with real SSO payload', function () {
    config()->set('auth.sso_allowed_domain', 'dssc.edu.ph');

    $payload = [
        'Student ID'      => '2018-00162',
        'FullName'        => 'MONTOYA , CARL OHMAR',
        'Email'           => 'carlohmar.montoya@dssc.edu.ph',
        'Year Level'      => '4',
        'Program'         => 'Bachelor of Science in Information Technology',
        'Department Code' => 'IT',
        'College'         => 'COLLEGE OF INFORMATION AND DIGITAL SCIENCES',
        'College Code'    => 'CIDS',
    ];

    $socialiteUser = new SocialiteUser();
    $socialiteUser->id = '2018-00162';
    $socialiteUser->name = 'MONTOYA , CARL OHMAR';
    $socialiteUser->email = 'carlohmar.montoya@dssc.edu.ph';
    $socialiteUser->user = $payload;

    $provider = Mockery::mock('Laravel\Socialite\Two\AbstractProvider');
    $provider->shouldReceive('stateless')->andReturnSelf();
    $provider->shouldReceive('user')->andReturn($socialiteUser);

    Socialite::shouldReceive('driver')->with('student_portal')->andReturn($provider);

    $response = $this->get(route('student-portal.callback'));

    $response->assertRedirect(route('user.home'));
    $this->assertAuthenticated();

    $user = User::where('email', 'carlohmar.montoya@dssc.edu.ph')->first();
    expect($user)->not->toBeNull();
    expect($user->name)->toBe('MONTOYA, CARL OHMAR');
    expect($user->student_id)->toBe('2018-00162');
    expect($user->school_portal_id)->toBe('2018-00162');
    expect($user->department)->toBe('Bachelor of Science in Information Technology');
    expect($user->program)->toBe('Bachelor of Science in Information Technology');
    expect($user->department_code)->toBe('IT');
    expect($user->year_level)->toBe('4');
    expect($user->college)->toBe('COLLEGE OF INFORMATION AND DIGITAL SCIENCES');
    expect($user->college_code)->toBe('CIDS');
    expect($user->auth_provider)->toBe('student_portal');
    expect($user->status)->toBe('approved');
    expect($user->role)->toBe('User');

    $activity = ActivityLog::where('user_id', $user->id)->first();
    expect($activity)->not->toBeNull();
    expect($activity->action)->toBe('student_portal_sso_login');
});

test('student portal callback updates existing user and logs them in', function () {
    config()->set('auth.sso_allowed_domain', 'dssc.edu.ph');

    $existing = User::factory()->create([
        'name' => 'Old Name',
        'email' => 'juan.delacruz@dssc.edu.ph',
        'role' => 'Admin',
        'status' => 'pending',
        'auth_provider' => 'clinicqr',
    ]);

    $socialiteUser = new SocialiteUser();
    $socialiteUser->id = 'portal-user-999';
    $socialiteUser->name = 'Juan Dela Cruz';
    $socialiteUser->email = 'juan.delacruz@dssc.edu.ph';
    $socialiteUser->user = [
        'id' => 'portal-user-999',
        'name' => 'Juan Dela Cruz',
        'email' => 'juan.delacruz@dssc.edu.ph',
        'employee_id' => 'EMP-00100',
        'user_type' => 'Employee',
        'department' => 'Clinic Staff',
    ];

    $provider = Mockery::mock('Laravel\Socialite\Two\AbstractProvider');
    $provider->shouldReceive('stateless')->andReturnSelf();
    $provider->shouldReceive('user')->andReturn($socialiteUser);

    Socialite::shouldReceive('driver')->with('student_portal')->andReturn($provider);

    $response = $this->get(route('student-portal.callback'));

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticatedAs($existing);

    $existing->refresh();
    expect($existing->name)->toBe('Juan Dela Cruz');
    expect($existing->school_portal_id)->toBe('portal-user-999');
    expect($existing->status)->toBe('approved');
});

test('student portal callback blocks unauthorized domain', function () {
    config()->set('auth.sso_allowed_domain', 'dssc.edu.ph');

    $socialiteUser = new SocialiteUser();
    $socialiteUser->id = 'external-123';
    $socialiteUser->name = 'External User';
    $socialiteUser->email = 'external@gmail.com';
    $socialiteUser->user = ['id' => 'external-123', 'name' => 'External User', 'email' => 'external@gmail.com'];

    $provider = Mockery::mock('Laravel\Socialite\Two\AbstractProvider');
    $provider->shouldReceive('stateless')->andReturnSelf();
    $provider->shouldReceive('user')->andReturn($socialiteUser);

    Socialite::shouldReceive('driver')->with('student_portal')->andReturn($provider);

    $response = $this->get(route('student-portal.callback'));

    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

test('student portal callback handles exceptions gracefully', function () {
    $provider = Mockery::mock('Laravel\Socialite\Two\AbstractProvider');
    $provider->shouldReceive('stateless')->andReturnSelf();
    $provider->shouldReceive('user')->andThrow(new \Exception('OAuth token exchange failed'));

    Socialite::shouldReceive('driver')->with('student_portal')->andReturn($provider);

    $response = $this->get(route('student-portal.callback'));

    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});
