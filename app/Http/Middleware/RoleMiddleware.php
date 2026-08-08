<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        if (!Auth::check()) {
            return redirect('/login')->with('error', 'Please login first.');
        }

        $userRole = Auth::user()->role;

        if (!in_array($userRole, $roles)) {
            abort(403, 'Access denied. You do not have permission to view this page.');
        }

        return $next($request);
    }
}