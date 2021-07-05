//runs on the client. import into the products page
const deleteProduct = (btn) => {
 const prodId = btn.parentNode.querySelector('[name=productId]').value;
 const csrf =  btn.parentNode.querySelector('[name=_csrf]').value;
  const productElement  = btn.closest('article'); //to delete that particular element in  the dom

 fetch('/admin/product/' + prodId, {
     method: 'DELETE',
     headers: {
         'csrf-token': csrf
     }
 }).then(result => {
     console.log(result)
     return result.json()
 }).then(data => {
     console.log(data)
     productElement.parentNode.removeChild(productElement)
 }).catch(err => {
     console.log(err)
 })//can also be used for sendig data
};