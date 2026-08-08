<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user()
                    ? [
                        ...$request->user()->only(
                            'id',
                            'name',
                            'username',
                            'email',
                            'role',
                            'student_id',
                            'employee_id',
                            'user_type',
                            'department',
                            'contact_number',
                            'date_of_birth',
                            'gender',
                            'address',
                            'profile_photo',
                        ),
                        'profile_photo_url' => $request->user()->profile_photo
                            ? asset('storage/' . $request->user()->profile_photo)
                            : null,
                    ]
                    : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'info' => fn () => $request->session()->get('info'),
            ],
            'notifications' => [
                'unread_count' => fn () => $request->user()
                    ? DB::table('notifications')->where('user_id', $request->user()->id)->where('is_read', false)->count()
                    : 0,
                'latest' => fn () => $request->user()
                    ? DB::table('notifications')
                        ->where('user_id', $request->user()->id)
                        ->latest()
                        ->take(6)
                        ->get(['id', 'title', 'message', 'type', 'is_read', 'link', 'created_at'])
                    : [],
            ],
        ];
    }
}
