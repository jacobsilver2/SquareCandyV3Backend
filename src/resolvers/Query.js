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
    itemsConnection: forwardTo('db')

};

module.exports = Query;
