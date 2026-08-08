<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ml_recommendation_decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('source_month', 7);
            $table->string('prediction_month', 7);
            $table->string('complaint_category');
            $table->unsignedInteger('current_cases')->default(0);
            $table->decimal('predicted_cases', 8, 2)->default(0);
            $table->string('trend_level')->nullable();
            $table->unsignedSmallInteger('priority_score')->default(0);
            $table->text('recommended_action')->nullable();
            $table->enum('decision', ['Approved', 'Modified', 'Rejected']);
            $table->text('final_action')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->unique(['source_month', 'prediction_month', 'complaint_category'], 'ml_decision_forecast_category_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ml_recommendation_decisions');
    }
};
