<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Inertia\Inertia;


class NotificationController extends Controller
{
    public function index()
    {
        $notifications = Notification::where('user_id', auth()->id())
            ->latest()
            ->paginate(20);

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    public function show($id)
    {
        $notification = Notification::where('user_id', auth()->id())
            ->findOrFail($id);

        // Mark as read
        if (!$notification->is_read) {
            $notification->update(['is_read' => true]);
        }

        return Inertia::render('Notifications/Show', [
            'notification' => $notification,
        ]);
    }

    public function readAll()
    {
        Notification::where('user_id', auth()->id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return back()->with('success', 'All notifications marked as read.');
    }
}
