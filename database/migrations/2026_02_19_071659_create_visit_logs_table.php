<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visit_logs', function (Blueprint $table) {
            $table->id('log_id');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('visit_purpose');
            $table->timestamp('timestamp')->useCurrent();
            $table->boolean('qr_scanned')->default(true);
            $table->enum('verification_status', ['Pending', 'Verified', 'Cleared'])->default('Pending');
            $table->text('medical_notes')->nullable();
            $table->foreignId('cleared_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visit_logs');
    }
};