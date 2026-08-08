<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('info'); // info, success, warning, error
            $table->string('link')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });

        // Add profile_photo to users
        Schema::table('users', function (Blueprint $table) {
            $table->string('profile_photo')->nullable()->after('employee_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('profile_photo');
        });
    }
};