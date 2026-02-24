import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    category: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
          category: ""
        });
      }, 3000);
    }, 500);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      details: ["info@ricecare.ai", "support@ricecare.ai"],
      color: "bg-blue-500"
    },
    {
      icon: Phone,
      title: "Call Us",
      details: ["+91 123 456 7890", "+91 098 765 4321"],
      color: "bg-green-500"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      details: ["123 Agricultural Research Center", "Patna, Bihar 800001, India"],
      color: "bg-orange-500"
    },
    {
      icon: Clock,
      title: "Working Hours",
      details: ["Monday - Friday: 9:00 AM - 6:00 PM", "Saturday: 9:00 AM - 2:00 PM"],
      color: "bg-purple-500"
    }
  ];

  const helpCategories = [
    {
      title: "Technical Support",
      description: "Having trouble with the platform? Our technical team is here to help.",
      icon: "🔧"
    },
    {
      title: "Disease Identification",
      description: "Need assistance with disease detection results or treatment advice?",
      icon: "🔬"
    },
    {
      title: "Training & Workshops",
      description: "Interested in learning more? We offer training sessions for farmers.",
      icon: "📚"
    },
    {
      title: "Partnership Opportunities",
      description: "Explore collaboration opportunities with RiceCare AI.",
      icon: "🤝"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-800 to-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl mb-6">Get in Touch</h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Have questions? We're here to help. Reach out to our team for support, 
            feedback, or partnership inquiries.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            return (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow border-green-200">
                <div className={`${info.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg text-gray-900 mb-3">{info.title}</h3>
                {info.details.map((detail, idx) => (
                  <p key={idx} className="text-sm text-gray-600">{detail}</p>
                ))}
              </Card>
            );
          })}
        </div>

        {/* Main Content: Form + Help Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="p-8 border-green-200">
              <h2 className="text-2xl text-green-900 mb-6">Send Us a Message</h2>
              
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl text-green-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-600">
                    Thank you for contacting us. We'll get back to you within 24-48 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Enter your name"
                        className="border-gray-300"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="your@email.com"
                        className="border-gray-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+91 XXXXX XXXXX"
                        className="border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        required
                        value={formData.category}
                        onValueChange={(value) => setFormData({...formData, category: value})}
                      >
                        <SelectTrigger id="category" className="border-gray-300">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical Support</SelectItem>
                          <SelectItem value="disease">Disease Identification</SelectItem>
                          <SelectItem value="training">Training & Workshops</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="Brief description of your inquiry"
                      className="border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="Provide details about your inquiry..."
                      className="min-h-[150px] border-gray-300"
                    />
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              )}
            </Card>
          </div>

          {/* Help Categories Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 border-green-200">
              <h3 className="text-xl text-green-900 mb-4">How Can We Help?</h3>
              <div className="space-y-4">
                {helpCategories.map((category, index) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h4 className="text-sm text-gray-900 mb-1">{category.title}</h4>
                        <p className="text-xs text-gray-600">{category.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <h3 className="text-lg text-green-900 mb-2">Need Immediate Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                For urgent technical issues or critical disease emergencies, 
                please call our 24/7 helpline
              </p>
              <div className="bg-white p-4 rounded-lg border border-green-200 text-center">
                <Phone className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-xl text-green-900">1800-123-4567</p>
                <p className="text-xs text-gray-500 mt-1">Toll Free</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Map Section (Placeholder) */}
        <div className="mt-16">
          <Card className="p-8 border-green-200">
            <h2 className="text-2xl text-green-900 mb-6 text-center">Our Location</h2>
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-gray-600">Agricultural Research Center</p>
                <p className="text-gray-500 text-sm">123 Research Complex, Patna, Bihar 800001</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
