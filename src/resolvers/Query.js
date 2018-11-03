const { forwardTo } = require('prisma-binding');

const Query = {
    // async items(parent, args, ctx, info) {
    //     const items = await ctx.db.query.items();
    //     return items
    // }

    // super easy if you don't need to
    // run extra logic or check for auth


    items: forwardTo('db'),
    item: forwardTo('db'),
    itemsConnection: forwardTo('db'),
    me(parent, args, ctx, info) {
        //check if there is a current user ID
        // important that we return null in this case because someone might not be logged in
        if(!ctx.request.userId) {
            return null;
        }
        return ctx.db.query.user({
            where: {id: ctx.request.userId},
        }, info);
    }
};

module.exports = Query;
