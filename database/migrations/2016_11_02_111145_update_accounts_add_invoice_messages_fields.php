<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

class UpdateAccountsAddInvoiceMessagesFields extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
	    Schema::table('accounts', function (Blueprint $table){
		   $table->text('invoice_needs')->nullable();
		   $table->text('invoice_delays')->nullable();
		   $table->text('invoice_specifications')->nullable();
	    });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
	    Schema::table('accounts', function (Blueprint $table){
		    $table->dropColumn('invoice_needs');
		    $table->dropColumn('invoice_delays');
		    $table->dropColumn('invoice_specifications');
	    });
    }
}
