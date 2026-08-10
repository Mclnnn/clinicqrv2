<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'auth_provider')) {
                $table->string('auth_provider', 50)
                    ->default('clinicqr')
                    ->after('password');
            }

            if (!Schema::hasColumn('users', 'school_portal_id')) {
                $table->string('school_portal_id', 100)
                    ->nullable()
                    ->unique()
                    ->after('auth_provider');
            }

            if (!Schema::hasColumn('users', 'school_portal_synced_at')) {
                $table->timestamp('school_portal_synced_at')
                    ->nullable()
                    ->after('school_portal_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'school_portal_id')) {
                $table->dropUnique(['school_portal_id']);
            }

            $columns = [];

            foreach (['school_portal_synced_at', 'school_portal_id', 'auth_provider'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $columns[] = $column;
                }
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
