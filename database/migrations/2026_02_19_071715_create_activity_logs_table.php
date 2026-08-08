<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id('log_id');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('action');
            $table->timestamp('timestamp')->useCurrent();
            $table->string('ip_address')->nullable();
            $table->text('additional_details')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};