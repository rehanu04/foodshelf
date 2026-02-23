package com.rehanu.foodshelf

import android.app.Application
import androidx.room.Room
import com.rehanu.foodshelf.data.local.FoodShelfDb

class FoodShelfApp : Application() {
    lateinit var db: FoodShelfDb
        private set

    override fun onCreate() {
        super.onCreate()
        db = Room.databaseBuilder(
            applicationContext,
            FoodShelfDb::class.java,
            "foodshelf.db"
        ).build()
    }
}