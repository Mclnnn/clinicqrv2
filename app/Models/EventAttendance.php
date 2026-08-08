<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventAttendance extends Model
{
    protected $fillable = [
    'event_id',
    'user_id',
    'student_id',
    'scanned_at',
];

    protected $casts = [
        'scanned_at' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}