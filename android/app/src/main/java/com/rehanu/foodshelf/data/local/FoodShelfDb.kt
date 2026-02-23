package com.rehanu.foodshelf.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.rehanu.foodshelf.data.model.GroceryItemEntity

@Database(entities = [GroceryItemEntity::class], version = 1, exportSchema = false)
abstract class FoodShelfDb : RoomDatabase() {
    abstract fun groceryDao(): GroceryDao
}