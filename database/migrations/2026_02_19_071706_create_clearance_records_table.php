<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clearance_records', function (Blueprint $table) {
            $table->id('clearance_id');
            $table->foreignId('log_id')->constrained('visit_logs', 'log_id')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('clearance_type');
            $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');
            $table->foreignId('signed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('signed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clearance_records');
    }
};