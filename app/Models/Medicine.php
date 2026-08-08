<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    protected $fillable = [
        'name', 'description', 'usage',
        'quantity', 'is_available', 'category',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'is_available' => 'boolean',
    ];

    public function getStatusAttribute()
    {
        if ($this->quantity <= 0) {
            return 'Out of Stock';
        }

        if ($this->quantity < 10) {
            return 'Available (Critical)';
        }

        if ($this->quantity <= 30) {
            return 'Available (Need to Order)';
        }

        return 'Available';
    }
}
