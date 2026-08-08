<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckApproved
{
    public function handle(Request $request, Closure $next)
    {
        if (!Auth::check()) {
            return redirect('/login');
        }

        $user = Auth::user();

        // Super Admin is always approved
        if ($user->role === 'Super Admin') {
            return $next($request);
        }

        if ($user->status === 'pending') {
            Auth::logout();
            return redirect('/login')->with('error', 'Your account is pending approval from the Super Admin.');
        }

        if ($user->status === 'rejected') {
            Auth::logout();
            return redirect('/login')->with('error', 'Your account has been rejected. Reason: ' . $user->rejection_reason);
        }

        return $next($request);
    }
}