<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (
            Schema::hasColumn('appointments', 'appointment_type') &&
            Schema::hasColumn('appointments', 'appointment_date') &&
            Schema::hasColumn('appointments', 'appointment_time') &&
            Schema::hasColumn('appointments', 'status') &&
            Schema::hasColumn('appointments', 'notes') &&
            Schema::hasColumn('appointments', 'rejection_reason') &&
            Schema::hasColumn('appointments', 'approved_by')
        ) {
            return;
        }

        Schema::table('appointments', function (Blueprint $table) {
            $table->string('appointment_type')->after('user_id');
            $table->date('appointment_date')->after('appointment_type');
            $table->string('appointment_time', 20)->after('appointment_date');

            $table->string('status')->default('pending')->after('appointment_time');
            $table->text('notes')->nullable()->after('status');

            $table->text('rejection_reason')->nullable()->after('notes');
            $table->unsignedBigInteger('approved_by')->nullable()->after('rejection_reason');

            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();

            // Optional indexes (helps)
            $table->index(['appointment_date', 'appointment_time']);
            $table->index(['user_id', 'appointment_date']);
        });
    }

    public function down(): void
    {
        //
    }
};
