<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('event_attendances', 'student_id')) {
            Schema::table('event_attendances', function (Blueprint $table) {
                $table->string('student_id')->nullable()->after('user_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('event_attendances', 'student_id')) {
            Schema::table('event_attendances', function (Blueprint $table) {
                $table->dropColumn('student_id');
            });
        }
    }
};