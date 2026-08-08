<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Only add if not exists
            if (!Schema::hasColumn('users', 'username')) {
                $table->string('username')->nullable()->unique()->after('name');
            }
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('User')->after('password');
            }
            if (!Schema::hasColumn('users', 'status')) {
                $table->string('status')->default('pending')->after('role');
            }
            if (!Schema::hasColumn('users', 'student_id')) {
                $table->string('student_id')->nullable()->unique()->after('status');
            }
            if (!Schema::hasColumn('users', 'employee_id')) {
                $table->string('employee_id')->nullable()->unique()->after('student_id');
            }
            if (!Schema::hasColumn('users', 'user_type')) {
                $table->string('user_type')->nullable()->after('employee_id'); // Student, Employee, Staff
            }
            if (!Schema::hasColumn('users', 'department')) {
                $table->string('department')->nullable()->after('user_type');
            }
            if (!Schema::hasColumn('users', 'contact_number')) {
                $table->string('contact_number')->nullable()->after('department');
            }
            if (!Schema::hasColumn('users', 'date_of_birth')) {
                $table->date('date_of_birth')->nullable()->after('contact_number');
            }
            if (!Schema::hasColumn('users', 'gender')) {
                $table->string('gender')->nullable()->after('date_of_birth');
            }
            if (!Schema::hasColumn('users', 'address')) {
                $table->text('address')->nullable()->after('gender');
            }
            if (!Schema::hasColumn('users', 'profile_photo')) {
                $table->string('profile_photo')->nullable()->after('address');
            }
            if (!Schema::hasColumn('users', 'created_by')) {
                $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null')->after('profile_photo');
            }
            if (!Schema::hasColumn('users', 'rejection_reason')) {
                $table->string('rejection_reason')->nullable()->after('created_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'username', 'role', 'status', 'student_id', 'employee_id',
                'user_type', 'department', 'contact_number', 'date_of_birth',
                'gender', 'address', 'profile_photo', 'created_by', 'rejection_reason',
            ]);
        });
    }
};