<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

class UpdateInvoicesAddCoeffisientFields extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
	    Schema::table('invoices', function (Blueprint $table) {
		    $table->boolean('copyright_included')->default(0);
		    $table->string('exclusivity_cf');
		    $table->string('utilization_cf');
		    $table->string('duration_cf');
		    $table->string('scope_visibility_cf');
	    });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
	    Schema::table('invoices', function (Blueprint $table){
		    $table->dropColumn('copyright_included');
		    $table->dropColumn('exclusivity_cf');
		    $table->dropColumn('utilization_cf');
		    $table->dropColumn('duration_cf');
		    $table->dropColumn('scope_visibility_cf');
	    });
    }
}
