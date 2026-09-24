import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { userAPI, reviewAPI } from '../services/api';
import { Appointment, Favorite, SupportGroup, Notification, Post } from '../types';
import { useAuth } from '../context/AuthContext';

const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="text-yellow-500">
    {'★'.repeat(rating)}<span className="text-gray-300">{'★'.repeat(5 - rating)}</span>
  </span>
);

const ProfilePage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [groups, setGroups] = useState<SupportGroup[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, content: '', isAnonymous: false });
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [appointmentsRes, favoritesRes, groupsRes, notificationsRes, postsRes] = await Promise.all([
          userAPI.getAppointments(),
          userAPI.getFavorites(),
          userAPI.getGroups(),
          userAPI.getNotifications(),
          userAPI.getMyPosts()
        ]);
        setAppointments(appointmentsRes.data);
        setFavorites(favoritesRes.data);
        setGroups(groupsRes.data);
        setNotifications(notificationsRes.data);
        setMyPosts(postsRes.data);
      } catch (error) {
        console.error('获取用户数据失败:', error);
      }
    };
    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const tabs = [
    { id: 'appointments', label: '咨询记录', icon: '📅' },
    { id: 'favorites', label: '我的收藏', icon: '⭐' },
    { id: 'groups', label: '我的小组', icon: '👥' },
    { id: 'posts', label: '我的帖子', icon: '📝' },
    { id: 'notifications', label: '系统通知', icon: '🔔' }
  ];

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('确定要取消这个预约吗？')) return;
    try {
      await fetch(`/api/appointments/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      alert('取消成功');
      const res = await userAPI.getAppointments();
      setAppointments(res.data);
    } catch (error) {
      alert('取消失败');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingId) return;
    try {
      await reviewAPI.create(reviewingId, reviewData);
      alert('评价提交成功！');
      setReviewingId(null);
      setReviewData({ rating: 5, content: '', isAnonymous: false });
      const res = await userAPI.getAppointments();
      setAppointments(res.data);
    } catch (error: any) {
      alert(error.response?.data?.error || '评价提交失败');
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingId) return;
    try {
      await reviewAPI.reply(replyingId, { reply: replyText });
      alert('回复成功！');
      setReplyingId(null);
      setReplyText('');
      const res = await userAPI.getAppointments();
      setAppointments(res.data);
    } catch (error: any) {
      alert(error.response?.data?.error || '回复失败');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-5xl">
            👤
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              {user.nickname || user.username}
            </h1>
            <p className="text-gray-500 mb-2">{user.email}</p>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {user.role === 'ADMIN' ? '管理员' :
                 user.role === 'COUNSELOR' ? '咨询师' : '普通用户'}
              </span>
              {user.anonymousName && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  匿名身份：{user.anonymousName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b overflow-x-auto">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'appointments' && (
            <div className="space-y-4">
              {appointments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📅</div>
                  <p>暂无咨询记录</p>
                  <Link to="/counselors" className="text-primary-600 hover:underline mt-2 inline-block">
                    去预约咨询师
                  </Link>
                </div>
              ) : (
                appointments.map(appointment => (
                  <div key={appointment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{appointment.title}</h3>
                        <p className="text-sm text-gray-500">
                          {user.role === 'COUNSELOR' 
                            ? `来访者：${appointment.client.nickname || appointment.client.username}`
                            : `咨询师：${appointment.counselor.nickname || appointment.counselor.username}`
                          }
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                        appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        appointment.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {appointment.status === 'CONFIRMED' ? '已确认' :
                         appointment.status === 'PENDING' ? '待确认' :
                         appointment.status === 'COMPLETED' ? '已完成' : '已取消'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {new Date(appointment.schedule.date).toLocaleDateString('zh-CN')} {appointment.schedule.startTime} - {appointment.schedule.endTime}
                    </p>
                    <p className="text-lg font-bold text-primary-600 mb-3">
                      ¥{appointment.price}
                    </p>
                    {appointment.status === 'PENDING' || appointment.status === 'CONFIRMED' ? (
                      <button
                        onClick={() => handleCancelAppointment(appointment.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        取消预约
                      </button>
                    ) : null}

                    {user.role !== 'COUNSELOR' && appointment.status === 'COMPLETED' && !appointment.review && (
                      <button
                        onClick={() => {
                          setReviewingId(appointment.id);
                          setReviewData({ rating: 5, content: '', isAnonymous: false });
                        }}
                        className="btn-primary text-sm mt-2"
                      >
                        评价本次咨询
                      </button>
                    )}

                    {appointment.review && (
                      <div className="mt-3 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <StarDisplay rating={appointment.review.rating} />
                          <span className="text-xs text-gray-500">
                            {user.role === 'COUNSELOR'
                              ? '来访者评价'
                              : appointment.review.isAnonymous ? '匿名评价' : '我的评价'}
                            {' · '}
                            {new Date(appointment.review.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{appointment.review.content}</p>
                        {appointment.review.reply ? (
                          <div className="mt-2 pl-3 border-l-2 border-primary-200">
                            <p className="text-xs text-primary-600 mb-1">咨询师回复</p>
                            <p className="text-sm text-gray-700">{appointment.review.reply}</p>
                          </div>
                        ) : user.role === 'COUNSELOR' ? (
                          <button
                            onClick={() => {
                              setReplyingId(appointment.review!.id);
                              setReplyText('');
                            }}
                            className="text-primary-600 hover:underline text-sm mt-2"
                          >
                            回复评价
                          </button>
                        ) : (
                          <p className="text-xs text-gray-400 mt-2">咨询师暂未回复</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-4">
              {favorites.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">⭐</div>
                  <p>暂无收藏</p>
                  <Link to="/posts" className="text-primary-600 hover:underline mt-2 inline-block">
                    去看看帖子
                  </Link>
                </div>
              ) : (
                favorites.map(favorite => (
                  <Link
                    key={favorite.id}
                    to={`/posts/${favorite.postId}`}
                    className="block border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <h3 className="font-semibold text-gray-800 mb-2">{favorite.post.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{favorite.post.content}</p>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="space-y-4">
              {groups.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">👥</div>
                  <p>还没有加入任何小组</p>
                  <Link to="/groups" className="text-primary-600 hover:underline mt-2 inline-block">
                    去加入小组
                  </Link>
                </div>
              ) : (
                groups.map(group => (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className="block border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <h3 className="font-semibold text-gray-800 mb-2">{group.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>成员：{group._count?.members || group.members?.length || 0}/{group.maxMembers}</span>
                      <span>角色：{(group as any).role === 'leader' ? '组长' : '成员'}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-4">
              {myPosts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📝</div>
                  <p>还没有发布过帖子</p>
                  <Link to="/posts" className="text-primary-600 hover:underline mt-2 inline-block">
                    去发布第一篇
                  </Link>
                </div>
              ) : (
                myPosts.map(post => (
                  <Link
                    key={post.id}
                    to={`/posts/${post.id}`}
                    className="block border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <h3 className="font-semibold text-gray-800 mb-2">
                      {post.title}
                      {post.isAnonymous && <span className="ml-2 text-xs text-purple-600">(匿名)</span>}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.content}</p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>👁 {post.viewCount}</span>
                      <span>💬 {post.replyCount}</span>
                      <span>❤️ {post.likeCount}</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🔔</div>
                  <p>暂无通知</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-4 ${notification.isRead ? 'bg-gray-50' : 'bg-blue-50'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{notification.content}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {reviewingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">评价本次咨询</h2>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  评分 *
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className={`text-3xl transition-colors ${
                        star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-500 self-center">{reviewData.rating} 分</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  咨询感受 *
                </label>
                <textarea
                  value={reviewData.content}
                  onChange={e => setReviewData({ ...reviewData, content: e.target.value })}
                  className="input-field min-h-[100px]"
                  placeholder="写下这次咨询带给你的感受..."
                  required
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={reviewData.isAnonymous}
                  onChange={e => setReviewData({ ...reviewData, isAnonymous: e.target.checked })}
                  className="rounded"
                />
                匿名展示（公开区域不显示我的昵称）
              </label>

              <p className="text-xs text-gray-400">评价提交后将固定保存，无法修改或重复提交。</p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingId(null)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  提交评价
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {replyingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">回复评价</h2>
            <form onSubmit={handleSubmitReply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  回复内容 *
                </label>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="input-field min-h-[100px]"
                  placeholder="感谢来访者的反馈，写下你的回复..."
                  required
                />
              </div>

              <p className="text-xs text-gray-400">回复将公开展示在评价下方，且只能回复一次。</p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyingId(null)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  提交回复
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
