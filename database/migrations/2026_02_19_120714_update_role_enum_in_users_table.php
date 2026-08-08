<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('Super Admin', 'Admin', 'User', 'Clinic Staff') DEFAULT 'User'");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('Super Admin', 'Admin', 'User') DEFAULT 'User'");
    }
};
