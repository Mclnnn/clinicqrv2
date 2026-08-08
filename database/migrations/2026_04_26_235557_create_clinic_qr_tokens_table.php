<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_qr_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('token')->unique();           // unique daily token
            $table->date('valid_date');                  // the date this token is valid for
            $table->timestamp('expires_at');             // 11:59 PM of valid_date
            $table->foreignId('generated_by')
                  ->constrained('users')
                  ->onDelete('cascade');                 // who generated it (super admin)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_qr_tokens');
    }
};