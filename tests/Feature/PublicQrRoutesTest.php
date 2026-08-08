<?php

use App\Models\ClinicQrToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeQrAdmin(): User
{
    return User::factory()->create([
        'role' => 'Super Admin',
        'status' => 'approved',
    ]);
}

function makeClinicQrToken(): ClinicQrToken
{
    return ClinicQrToken::create([
        'token' => 'test-public-checkin-token',
        'valid_date' => now()->toDateString(),
        'expires_at' => now()->addYear(),
        'generated_by' => makeQrAdmin()->id,
    ]);
}

test('clinic check-in qr page is public for guests', function () {
    $token = makeClinicQrToken();

    $this->get(route('clinic.checkin', $token->token))
        ->assertOk()
        ->assertSee('Clinic Check-in');
});

test('clinic check-in qr page is not blocked by normal user role middleware', function () {
    $token = makeClinicQrToken();
    $user = User::factory()->create([
        'role' => 'User',
        'status' => 'approved',
    ]);

    $this->actingAs($user)
        ->get(route('clinic.checkin', $token->token))
        ->assertOk()
        ->assertSee('Clinic Check-in');
});

test('clinic check-in qr post is csrf-exempt and does not redirect phone scanners to protected pages', function () {
    $token = makeClinicQrToken();

    $this->post(route('clinic.checkin.process', $token->token), [
        'student_id' => 'missing-id',
        'purpose' => 'General Check-in',
    ])->assertStatus(422)
        ->assertSee('ID Not Found')
        ->assertSee('Try again');
});
