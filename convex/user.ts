import { v } from "convex/values";
import { mutation } from "./_generated/server";

console.log("Convex loaded user.ts module");

export const CreateNewUser = mutation({
    args:{
        name: v.string(),
        email: v.string()
    },
    handler: async(ctx, args) => {
        //if user already exists
        const user = await ctx.db.query('UserTable')
            .filter((q) => q.eq(q.field('email'), args.email))
            .collect()

        //if not, create new user
        if(user?.length == 0){
            const userData = {
                name: args.name,
                email: args.email,
                Subscribtion: "free", // ✅ ADD DEFAULT SUBSCRIPTION
                token: 5000
            }
            const result = await ctx.db.insert('UserTable', userData);
            return {
                _id: result,
                ...userData
            };
        }
        return user[0];
    }
})

// ✅ ADD THIS - Manual subscription update
export const ManuallyUpdateSubscription = mutation({
  args: {
    email: v.string(),
    subscription: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("UserTable")
      .filter(q => q.eq(q.field("email"), args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      Subscribtion: args.subscription,
    });

    return { success: true, user };
  },
});

// ✅ ADD THIS - For webhook integration
export const UpdateSubscriptionByEmail = mutation({
  args: {
    email: v.string(),
    subscription: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("UserTable")
      .filter(q => q.eq(q.field("email"), args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      Subscribtion: args.subscription,
    });

    return { success: true };
  },
});