<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

class UpdateInvoicesAddMessagesFields extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
	public function up()
	{
		Schema::table('invoices', function (Blueprint $table){
			$table->text('invoice_needs');
			$table->text('invoice_delays');
			$table->text('invoice_specifications');
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
			$table->dropColumn('invoice_needs');
			$table->dropColumn('invoice_delays');
			$table->dropColumn('invoice_specifications');
		});
	}
}
