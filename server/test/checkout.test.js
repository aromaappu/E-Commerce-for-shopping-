import test from "node:test";
import assert from "node:assert/strict";
import { parseCheckoutItems, priceCheckoutItems } from "../src/lib/checkout.js";
const products = [{id:"1",product_code:"TM01",name:"Shirt",price:"₹799/-",image_url:"",out_of_stock:false}];
test("catalogue determines saved order price and name", () => {
  const result = priceCheckoutItems(parseCheckoutItems([{code:"TM01",qty:2,price:"₹1",name:"Fake"}]),products);
  assert.equal(result.total,1598);
  assert.equal(result.items[0].name,"Shirt");
});
test("combines duplicate items and old cart codes",()=>{
  assert.deepEqual(parseCheckoutItems([{code:"TM01_1720000000000",qty:2},{code:"tm01",qty:1}]),[{code:"TM01",qty:3}]);
});
test("rejects invalid orders",()=>{
  assert.throws(()=>parseCheckoutItems([{code:"TM01",qty:-1}]),/Invalid/);
  assert.throws(()=>priceCheckoutItems([{code:"NO",qty:1}],products),/available/);
  assert.throws(()=>priceCheckoutItems([{code:"TM01",qty:1}],[{...products[0],out_of_stock:true}]),/stock/);
});
