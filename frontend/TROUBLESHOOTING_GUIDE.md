# JuanLMS Mobile App - Troubleshooting Guide

## Current Issues and Solutions

### Issue 1: Classes Not Appearing for Students

**Problem**: Students see "You have no classes yet" even though they should have classes.

**Root Cause**: The student classes query is not finding matches in the database.

**Solutions Applied**:

1. **Enhanced Debugging**: Added comprehensive logging to see what's happening:
   ```javascript
   // Check all classes in database
   const allClasses = await db.collection('Classes').find({}).toArray();
   console.log('All classes in database:', allClasses.length);
   
   // Check user data
   const user = await db.collection('users').findOne({ _id: new ObjectId(studentID) });
   console.log('User found:', user);
   ```

2. **Multiple Query Approaches**: Added 5 different ways to find student classes:
   - String match in members array
   - Direct match in members array
   - ObjectId match in members array
   - userID match in members array
   - Email match in members array

3. **Test Class Creation**: Added route to create sample class:
   ```
   POST /api/test/create-sample-class
   ```

### Issue 2: 404 Error for Student Assignments

**Problem**: Console shows 404 error for `/api/student-assignments`

**Solution**: Added missing route:
   ```javascript
   router.get('/student-assignments', async (req, res) => {
     // Returns empty assignments array for now
   });
   ```

### Issue 3: Navigation Warning

**Problem**: "Found screens with the same name nested inside one another. Check: SDash, SDash > SDash"

**Solution**: Fixed duplicate screen names:
   - Changed tab screen name from `SDash` to `StudentDashboard`
   - Updated `CustomBottomNav.js` to use new screen name

## Testing Steps

### Step 1: Create Test Data

1. **Start the server**:
   ```bash
   cd server
   npm start
   ```

2. **Create a sample class** (using the student ID from logs):
   ```bash
   curl -X POST https://juanlms-webapp-server.onrender.com/api/test/create-sample-class
   ```

3. **Check the response** to ensure the class was created successfully.

### Step 2: Test Student Login

1. **Login as student** with the credentials from the logs
2. **Check console logs** for:
   - "All classes in database: X"
   - "User found: {...}"
   - "Approach 1 (string match): X classes found"
   - "Approach 2 (direct match): X classes found"
   - etc.

### Step 3: Verify Data Structure

Check the console logs to understand:

1. **How many classes exist** in the database
2. **What the class structure looks like** (members field format)
3. **What the user data looks like** (userID, email, etc.)
4. **Which query approach works**

## Common Data Structure Issues

### Issue A: Members Array Format

**Problem**: Classes might have members stored as:
- `members: ["student1", "student2"]` (strings)
- `members: [ObjectId1, ObjectId2]` (ObjectIds)
- `members: "student1"` (single string, not array)

**Solution**: The enhanced query handles all these cases.

### Issue B: User ID Mismatch

**Problem**: The student ID used in queries doesn't match what's stored in class members.

**Solution**: Check the user data to see what identifier should be used:
- `user._id` (ObjectId)
- `user.userID` (string)
- `user.email` (string)

### Issue C: Empty Database

**Problem**: No classes exist in the database.

**Solution**: Use the test route to create sample data.

## Debug Commands

### Check All Classes
```bash
curl https://juanlms-webapp-server.onrender.com/api/debug/classes
```

### Check Specific User
```bash
curl https://juanlms-webapp-server.onrender.com/api/debug/user/6845bdd2a05093bb0765c450
```

### Create Sample Class
```bash
curl -X POST https://juanlms-webapp-server.onrender.com/api/test/create-sample-class
```

## Expected Console Output

After fixes, you should see:

```
All classes in database: 1
Sample class structure: { classID: "C123", className: "Introduction to Computer Science", ... }
User found: { _id: ObjectId("..."), userID: "...", email: "..." }
Approach 1 (string match): 1 classes found
Final classes found: [{ classID: "C123", className: "Introduction to Computer Science", ... }]
```

## Next Steps

1. **Run the test commands** to create sample data
2. **Check console logs** to understand the data structure
3. **Verify the mobile app** shows the test class
4. **Create real classes** using the proper data structure
5. **Test with multiple students** to ensure scalability

## If Issues Persist

1. **Check MongoDB connection** - ensure database is accessible
2. **Verify collection names** - ensure using correct collection names
3. **Check user authentication** - ensure user is properly logged in
4. **Review data types** - ensure IDs match expected format
5. **Test with Postman** - verify API endpoints work independently 