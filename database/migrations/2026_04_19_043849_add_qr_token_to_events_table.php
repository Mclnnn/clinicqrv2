<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('events', 'qr_token')) {
            Schema::table('events', function (Blueprint $table) {
                $table->uuid('qr_token')->nullable()->after('created_by');
            });
        }

        $events = DB::table('events')->select('id', 'qr_token')->get();

        foreach ($events as $event) {
            if (empty($event->qr_token)) {
                DB::table('events')
                    ->where('id', $event->id)
                    ->update(['qr_token' => (string) Str::uuid()]);
            }
        }

        // add unique index only if it does not exist yet
        try {
            Schema::table('events', function (Blueprint $table) {
                $table->unique('qr_token');
            });
        } catch (\Throwable $e) {
            // ignore if already exists
        }
    }

    public function down(): void
    {
        try {
            Schema::table('events', function (Blueprint $table) {
                $table->dropUnique(['qr_token']);
            });
        } catch (\Throwable $e) {
        }

        if (Schema::hasColumn('events', 'qr_token')) {
            Schema::table('events', function (Blueprint $table) {
                $table->dropColumn('qr_token');
            });
        }
    }
};