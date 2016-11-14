<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

class UpdateInvoicesAddFields extends Migration
{
	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::table('invoices', function(Blueprint $table){
		   $table->string('order_from')->nullable();
		   $table->string('title')->nullable();
		   $table->string('reference')->nullable();
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::table('invoices', function(Blueprint $table){
			$table->dropColumn('order_from');
			$table->dropColumn('title');
			$table->dropColumn('reference');
		});
	}
}
