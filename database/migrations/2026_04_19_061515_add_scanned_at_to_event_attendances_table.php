<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('event_attendances', 'scanned_at')) {
            Schema::table('event_attendances', function (Blueprint $table) {
                $table->timestamp('scanned_at')->nullable()->after('student_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('event_attendances', 'scanned_at')) {
            Schema::table('event_attendances', function (Blueprint $table) {
                $table->dropColumn('scanned_at');
            });
        }
    }
};