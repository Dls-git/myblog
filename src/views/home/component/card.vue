<script setup>

</script>

<template>
  <div class="card hover-scale-to-wide">
      <h2 class="card-title">
        我是一个很长很长的title
      </h2>
    <div class="footer">
      <div class="detail small-font">
        <span>5天前</span>
        <span>100字</span>
        <span>1分钟</span>
      </div>
      <div class="continue">继续阅读&nbsp; -></div>
    </div>
  </div>
</template>

<style scoped>
.card{
  height: 120px;
  border-radius: 20px;
  padding: 20px;
  &:hover{
    /*同时加上一些阴影*/
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    /* 鼠标悬停时,卡片缩放 */
    animation: hoverScaleToWide 0.3s ease-in-out forwards;
    /*悬停变色*/
    background: rgb(248, 230, 231);
  }
  .card-title{
      font-size: 30px;
  }

  .footer{
    margin-top: 30px;
    display: flex;
    justify-content: space-between;
    .detail span{
      /* 文章详情,每个详情之间的间距 */
        &:not(:first-child) {
          margin-left: 10px;
        }
    }
    .continue{
        font-size: 22px;
      &:hover{
        cursor: pointer;
      }
    }
  }
}

</style>
