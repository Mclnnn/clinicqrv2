<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
       Schema::table('users', function (Blueprint $table) {
    $table->string('username')->nullable()->after('name');
    $table->string('student_id')->nullable()->after('email');
    $table->string('employee_id')->nullable()->after('student_id');
    $table->enum('role', ['Super Admin', 'Admin', 'User'])->default('User')->after('employee_id');
});
    }

    public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(['username', 'student_id', 'employee_id', 'role']);
    });
}
};