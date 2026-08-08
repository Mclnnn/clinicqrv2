<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {

            // Personal / DSSC info
            if (!Schema::hasColumn('users', 'user_type')) {
                $table->string('user_type', 50)->nullable()->after('status');
            }
            if (!Schema::hasColumn('users', 'department')) {
                $table->string('department', 255)->nullable()->after('user_type');
            }
            if (!Schema::hasColumn('users', 'contact_number')) {
                $table->string('contact_number', 30)->nullable()->after('department');
            }
            if (!Schema::hasColumn('users', 'date_of_birth')) {
                $table->date('date_of_birth')->nullable()->after('contact_number');
            }
            if (!Schema::hasColumn('users', 'gender')) {
                $table->string('gender', 50)->nullable()->after('date_of_birth');
            }
            if (!Schema::hasColumn('users', 'address')) {
                $table->string('address', 500)->nullable()->after('gender');
            }

            // IDs (if not existing yet)
            // NOTE: comment these out if you already have them in users table
            // $table->string('student_id', 50)->nullable()->unique()->after('address');
            // $table->string('employee_id', 50)->nullable()->unique()->after('student_id');
        });
    }

    public function down(): void
    {
        //
    }
};
