<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clearance_records', function (Blueprint $table) {

            // ── CRITICAL: make log_id nullable so new requests don't need a visit log ──
            // Only run this if log_id currently has NOT NULL constraint
            if (Schema::hasColumn('clearance_records', 'log_id')) {
                $table->unsignedBigInteger('log_id')->nullable()->change();
            }

            // ── Add new columns (skip if they already exist) ──────────────────────────
            if (!Schema::hasColumn('clearance_records', 'contact_number')) {
                $table->string('contact_number')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('clearance_records', 'school_year')) {
                $table->string('school_year')->nullable()->after('contact_number');
            }
            if (!Schema::hasColumn('clearance_records', 'semester')) {
                $table->string('semester')->nullable()->after('school_year');
            }
            if (!Schema::hasColumn('clearance_records', 'purpose')) {
                $table->string('purpose')->nullable()->after('semester');
            }
            if (!Schema::hasColumn('clearance_records', 'documents')) {
                $table->json('documents')->nullable()->after('purpose');
            }
            if (!Schema::hasColumn('clearance_records', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('status');
            }
            if (!Schema::hasColumn('clearance_records', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('rejection_reason');
            }
            if (!Schema::hasColumn('clearance_records', 'approved_by')) {
                $table->unsignedBigInteger('approved_by')->nullable()->after('approved_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('clearance_records', function (Blueprint $table) {
            // Revert log_id back to NOT NULL (only if needed)
            // $table->unsignedBigInteger('log_id')->nullable(false)->change();

            foreach (['contact_number','school_year','semester','purpose','documents','rejection_reason','approved_at','approved_by'] as $col) {
                if (Schema::hasColumn('clearance_records', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};